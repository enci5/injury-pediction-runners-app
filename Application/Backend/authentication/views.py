from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serialisers import RegisterSerialiser

@api_view(['POST'])
def register_view(request):
    serialiser = RegisterSerialiser(data=request.data)
    if serialiser.is_valid():
        serialiser.save()
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
    
    print(serialiser.errors)
    return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

def logout(request):
    return ''